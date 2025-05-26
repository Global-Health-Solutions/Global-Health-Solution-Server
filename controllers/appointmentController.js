const Appointment = require("../models/Appointment");
const Availability = require("../models/Availability");
const User = require("../models/User");
const { createAppointmentNotification } = require("../utils/notificationService");
const {
  sendAppointmentConfirmation,
  sendAppointmentReminder,
  sendAppointmentDayReminder,
  sendAppointmentCancellation,
} = require("../utils/emailService");

// Set doctor availability
const setAvailability = async (req, res) => {
  try {
    const { date, timeSlots, isRecurring, recurringPattern } = req.body;
    const doctorId = req.user._id;

    // Validate required fields
    if (!date || !timeSlots || !Array.isArray(timeSlots)) {
      return res.status(400).json({
        success: false,
        message: "Date and time slots are required",
      });
    }

    // Validate date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const requestDate = new Date(date);
    
    if (requestDate < today) {
      return res.status(400).json({
        success: false,
        message: "Cannot set availability for past dates",
      });
    }

    // Validate time slots
    for (const slot of timeSlots) {
      if (!slot.startTime || !slot.endTime) {
        return res.status(400).json({
          success: false,
          message: "All time slots must have start and end times",
        });
      }
      
      if (slot.startTime >= slot.endTime) {
        return res.status(400).json({
          success: false,
          message: "End time must be after start time",
        });
      }
    }

    // Check if there's existing availability for this date
    const existingAvailability = await Availability.findOne({ 
      doctor: doctorId, 
      date: requestDate 
    });

    let availability;
    
    if (existingAvailability) {
      // Preserve booked slots when updating - match by time, not index
      const mergedTimeSlots = [];
      
      // Create a map of existing slots by time for efficient lookup
      const existingSlotMap = new Map();
      existingAvailability.timeSlots.forEach(slot => {
        const timeKey = `${slot.startTime}-${slot.endTime}`;
        existingSlotMap.set(timeKey, slot);
      });
      
      // Process new slots and preserve bookings for matching times
      timeSlots.forEach(newSlot => {
        const timeKey = `${newSlot.startTime}-${newSlot.endTime}`;
        const existingSlot = existingSlotMap.get(timeKey);
        
        if (existingSlot && existingSlot.isBooked) {
          // Keep the existing booked slot as-is
          mergedTimeSlots.push(existingSlot);
        } else {
          // Add new slot or replace unbooked slot
          mergedTimeSlots.push({ ...newSlot, isBooked: false });
        }
      });

      console.log(`🔄 Updating availability: ${mergedTimeSlots.length} slots (preserved ${existingAvailability.timeSlots.filter(s => s.isBooked).length} booked slots)`);

      // Update existing availability
      availability = await Availability.findOneAndUpdate(
        { doctor: doctorId, date: requestDate },
        {
          timeSlots: mergedTimeSlots,
          isRecurring,
          recurringPattern,
        },
        { new: true }
      );
    } else {
      // Create new availability
      console.log(`➕ Creating new availability for ${requestDate.toISOString().split('T')[0]} with ${timeSlots.length} slots`);
      
      availability = await Availability.create({
        doctor: doctorId,
        date: requestDate,
        timeSlots: timeSlots.map(slot => ({ ...slot, isBooked: false })),
        isRecurring,
        recurringPattern,
      });
      
      console.log(`✅ Created availability with ID: ${availability._id}`);
    }

    console.log(`📊 Final availability has ${availability.timeSlots.length} total slots, ${availability.timeSlots.filter(s => !s.isBooked).length} available`);

    res.status(200).json({
      success: true,
      data: availability,
    });
  } catch (error) {
    console.error("Error setting availability:", error);
    res.status(500).json({
      success: false,
      message: "Error setting availability",
      error: error.message,
    });
  }
};

// Get available slots for a specialty
const getAvailableSlots = async (req, res) => {
  try {
    const { specialty, date } = req.query;

    console.log('🎯 Getting available slots for:', { specialty, date });
    console.log('📅 Raw date received:', date);
    console.log('📅 Date type:', typeof date);

    if (!specialty || !date) {
      console.log('❌ Missing required parameters:', { specialty, date });
      return res.status(400).json({
        success: false,
        message: "Specialty and date are required",
      });
    }

    // Enhanced doctor search with better specialty matching
    console.log('👥 Searching for doctors with specialty:', specialty);
    
    const doctors = await User.find({
      role: "specialist",
      specialistCategory: { $regex: new RegExp(`^${specialty}$`, 'i') }, // Case-insensitive exact match
      isApproved: true,
    });

    console.log(`👨‍⚕️ Found ${doctors.length} doctors for specialty: ${specialty}`);
    
    if (doctors.length > 0) {
      console.log('📋 Doctor details:');
      doctors.forEach(doc => {
        console.log(`  - ${doc.firstName} ${doc.lastName} (${doc.specialistCategory})`);
      });
    }

    if (doctors.length === 0) {
      // Additional search to debug specialty issues
      console.log('🔍 No doctors found, checking all specialists...');
      const allSpecialists = await User.find({
        role: "specialist",
        isApproved: true,
      }).select('firstName lastName specialistCategory');
      
      console.log(`📊 Total specialists in system: ${allSpecialists.length}`);
      const specialties = [...new Set(allSpecialists.map(s => s.specialistCategory).filter(Boolean))];
      console.log('📋 Available specialties:', specialties);
      
      return res.status(200).json({
        success: true,
        data: [],
        message: "No approved specialists found for this specialty",
        debug: {
          searchedSpecialty: specialty,
          availableSpecialties: specialties,
          totalSpecialists: allSpecialists.length
        }
      });
    }

    const doctorIds = doctors.map((doctor) => doctor._id);

    // Enhanced date parsing with timezone-aware date range
    console.log('📅 Processing date:', date);
    
    let requestDate;
    try {
      // Handle different date formats
      if (date.includes('T')) {
        requestDate = new Date(date);
      } else {
        // Assume YYYY-MM-DD format
        requestDate = new Date(date + 'T00:00:00.000Z');
      }
      
      if (isNaN(requestDate.getTime())) {
        throw new Error('Invalid date format');
      }
    } catch (dateError) {
      console.log('❌ Date parsing error:', dateError.message);
      return res.status(400).json({
        success: false,
        message: "Invalid date format. Please use YYYY-MM-DD",
      });
    }
    
    // Create a wider date range to handle timezone issues
    // Instead of exact day, use date string matching
    const dateStr = date; // Keep original YYYY-MM-DD format
    
    // Create start and end of day but with more tolerance for timezone issues
    const startOfDay = new Date(requestDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    
    const endOfDay = new Date(requestDate);
    endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);
    endOfDay.setUTCHours(23, 59, 59, 999);

    console.log('📅 Date range:', { 
      original: date,
      parsed: requestDate.toISOString(),
      startOfDay: startOfDay.toISOString(), 
      endOfDay: endOfDay.toISOString(),
      dateStr: dateStr
    });

    // First, let's check if there are ANY availabilities for these doctors on this date
    const allAvailabilities = await Availability.find({
      doctor: { $in: doctorIds },
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    }).populate("doctor", "firstName lastName specialistCategory");

    console.log(`📊 Total availabilities for this date: ${allAvailabilities.length}`);
    
    allAvailabilities.forEach(av => {
      const totalSlots = av.timeSlots.length;
      const availableSlots = av.timeSlots.filter(slot => !slot.isBooked).length;
      const bookedSlots = totalSlots - availableSlots;
      console.log(`  👨‍⚕️ Dr. ${av.doctor.firstName} ${av.doctor.lastName}: ${availableSlots}/${totalSlots} available (${bookedSlots} booked)`);
    });

    // Get all availabilities for these doctors on the specified date
    // We need to find availabilities that have at least one available slot
    const availabilities = await Availability.find({
      doctor: { $in: doctorIds },
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
      timeSlots: {
        $elemMatch: {
          isBooked: false,
        },
      },
    }).populate("doctor", "firstName lastName specialistCategory profileImage");

    console.log(`✅ Found ${availabilities.length} availabilities with available slots`);

    // Return the complete availability data but filter timeSlots to only include available ones
    const filteredAvailabilities = availabilities.map(availability => {
      const availableSlots = availability.timeSlots.filter(slot => !slot.isBooked);
      console.log(`  🎯 Dr. ${availability.doctor.firstName} ${availability.doctor.lastName}: ${availableSlots.length} available slots`);
      
      return {
        ...availability.toObject(),
        timeSlots: availableSlots,
        totalSlots: availability.timeSlots.length,
        availableSlots: availableSlots.length,
        bookedSlots: availability.timeSlots.length - availableSlots.length
      };
    }).filter(availability => availability.timeSlots.length > 0);

    console.log(`📋 Final filtered availabilities: ${filteredAvailabilities.length}`);
    
    const totalAvailableSlots = filteredAvailabilities.reduce((sum, av) => sum + av.availableSlots, 0);
    console.log(`🎯 Total available slots to return: ${totalAvailableSlots}`);

    res.status(200).json({
      success: true,
      data: filteredAvailabilities,
      totalDoctors: doctors.length,
      availableSlots: totalAvailableSlots,
      debug: {
        searchedSpecialty: specialty,
        searchedDate: date,
        parsedDate: requestDate.toISOString(),
        doctorsFound: doctors.length,
        totalAvailabilities: allAvailabilities.length,
        availabilitiesWithSlots: availabilities.length,
        finalFilteredCount: filteredAvailabilities.length
      }
    });
  } catch (error) {
    console.error("❌ Error fetching available slots:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching available slots",
      error: error.message,
    });
  }
};

// Book an appointment
const bookAppointment = async (req, res) => {
  try {
    const { availabilityId, timeSlotIndex, reason } = req.body;
    const patientId = req.user._id;

    console.log('Booking request:', { availabilityId, timeSlotIndex, reason, patientId });

    // Validate input
    if (!availabilityId || timeSlotIndex === undefined || !reason) {
      return res.status(400).json({
        success: false,
        message: "Availability ID, time slot index, and reason are required",
      });
    }

    // Get availability and populate doctor information
    const availability = await Availability.findById(availabilityId).populate('doctor');
    if (!availability) {
      return res.status(404).json({
        success: false,
        message: "Availability slot not found",
      });
    }

    console.log('Found availability:', availability);

    // Check if time slot index is valid
    if (timeSlotIndex < 0 || timeSlotIndex >= availability.timeSlots.length) {
      return res.status(400).json({
        success: false,
        message: "Invalid time slot index",
      });
    }

    // Check if slot is still available
    const timeSlot = availability.timeSlots[timeSlotIndex];
    if (timeSlot.isBooked) {
      return res.status(400).json({
        success: false,
        message: "This time slot is no longer available",
      });
    }

    console.log('Selected time slot:', timeSlot);
    
    // Create proper datetime by combining date and time
    const appointmentDate = new Date(availability.date);
    const [startHour, startMinute] = timeSlot.startTime.split(':');
    appointmentDate.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);

    console.log('Appointment date:', appointmentDate);

    // Create appointment
    const appointment = new Appointment({
      patient: patientId,
      specialist: availability.doctor._id,
      dateTime: appointmentDate,
      specialistCategory: availability.doctor.specialistCategory,
      reason,
      availabilitySlot: availabilityId,
    });

    console.log('Creating appointment:', appointment);

    // Save appointment first
    const savedAppointment = await appointment.save();
    console.log('Saved appointment:', savedAppointment);

    // Update availability - mark slot as booked
    availability.timeSlots[timeSlotIndex].isBooked = true;
    availability.timeSlots[timeSlotIndex].appointmentId = savedAppointment._id;
    await availability.save();

    console.log('Updated availability');

    // Get patient details for notifications
    const patient = await User.findById(patientId);

    console.log('Sending notifications...');
    
    // Send notifications (with error handling to not block the response)
    try {
      await Promise.all([
        createAppointmentNotification(savedAppointment, patient, "scheduled"),
        createAppointmentNotification(savedAppointment, availability.doctor, "scheduled"),
      ]);
      console.log('Notifications sent');
    } catch (notificationError) {
      console.error('Notification error:', notificationError);
      // Don't fail the appointment creation if notifications fail
    }

    // Send confirmation emails (with error handling)
    try {
      await Promise.all([
        sendAppointmentConfirmation(savedAppointment, patient),
        sendAppointmentConfirmation(savedAppointment, availability.doctor),
      ]);
      console.log('Confirmation emails sent');
    } catch (emailError) {
      console.error('Email error:', emailError);
      // Don't fail the appointment creation if emails fail
    }

    res.status(201).json({
      success: true,
      data: savedAppointment,
      message: "Appointment booked successfully",
    });
  } catch (error) {
    console.error("Error booking appointment:", error);
    res.status(500).json({
      success: false,
      message: "Error booking appointment",
      error: error.message,
    });
  }
};

// Cancel an appointment
const cancelAppointment = async (req, res) => {
  try {
    const { appointmentId, cancellationReason } = req.body;
    const userId = req.user._id;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Check if user is authorized to cancel
    if (
      appointment.patient.toString() !== userId.toString() &&
      appointment.specialist.toString() !== userId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this appointment",
      });
    }

    // Update appointment
    appointment.status = "cancelled";
    appointment.cancellationReason = cancellationReason;
    appointment.cancelledBy =
      appointment.patient.toString() === userId.toString() ? "patient" : "doctor";
    await appointment.save();

    // Update availability
    const availability = await Availability.findById(appointment.availabilitySlot);
    const timeSlot = availability.timeSlots.find(
      (slot) => slot.appointmentId.toString() === appointmentId
    );
    if (timeSlot) {
      timeSlot.isBooked = false;
      timeSlot.appointmentId = null;
      await availability.save();
  }

    // Get patient and doctor details for notifications
    const [patient, doctor] = await Promise.all([
      User.findById(appointment.patient),
      User.findById(appointment.specialist),
    ]);

    // Send notifications
    await Promise.all([
      createAppointmentNotification(appointment, patient, "cancelled"),
      createAppointmentNotification(appointment, doctor, "cancelled"),
    ]);

    // Send cancellation emails
    await Promise.all([
      sendAppointmentCancellation(appointment, patient),
      sendAppointmentCancellation(appointment, doctor),
    ]);

    res.status(200).json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error cancelling appointment",
      error: error.message,
    });
  }
};

// Get user's appointments
const getUserAppointments = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status, upcoming } = req.query;

    const query = {
      $or: [{ patient: userId }, { specialist: userId }],
    };

    if (status) {
      query.status = status;
    }

    if (upcoming === "true") {
      query.dateTime = { $gte: new Date() };
    }

    const appointments = await Appointment.find(query)
      .populate("patient", "firstName lastName email profileImage")
      .populate("specialist", "firstName lastName email specialistCategory profileImage")
      .sort({ dateTime: 1 });

    res.status(200).json({
      success: true,
      data: appointments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching appointments",
      error: error.message,
    });
  }
};

// Get available dates for a specialty (helpful for calendar view)
// Get available dates for a specialty
const getAvailableDates = async (req, res) => {
  try {
    const { specialty, startDate, endDate } = req.query;

    console.log('📅 Getting available dates for:', { specialty, startDate, endDate });

    if (!specialty) {
      return res.status(400).json({
        success: false,
        message: "Specialty is required",
      });
    }

    // Enhanced doctor search with better specialty matching (same as getAvailableSlots)
    console.log('👥 Searching for doctors with specialty:', specialty);
    
    const doctors = await User.find({
      role: "specialist",
      specialistCategory: { $regex: new RegExp(`^${specialty}$`, 'i') }, // Case-insensitive exact match
      isApproved: true,
    });

    console.log(`👨‍⚕️ Found ${doctors.length} doctors for specialty: ${specialty}`);

    if (doctors.length === 0) {
      // Additional search to debug specialty issues (same as getAvailableSlots)
      console.log('🔍 No doctors found, checking all specialists...');
      const allSpecialists = await User.find({
        role: "specialist",
        isApproved: true,
      }).select('firstName lastName specialistCategory');
      
      console.log(`📊 Total specialists in system: ${allSpecialists.length}`);
      const specialties = [...new Set(allSpecialists.map(s => s.specialistCategory).filter(Boolean))];
      console.log('📋 Available specialties:', specialties);
      
      return res.status(200).json({
        success: true,
        data: [],
        message: "No approved specialists found for this specialty",
        debug: {
          searchedSpecialty: specialty,
          availableSpecialties: specialties,
          totalSpecialists: allSpecialists.length
        }
      });
    }

    const doctorIds = doctors.map((doctor) => doctor._id);

    // Set default date range (next 30 days if not provided)
    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    console.log('Date range for search:', { start, end });

    // Get all availabilities for these doctors in the date range with available slots
    const availabilities = await Availability.find({
      doctor: { $in: doctorIds },
      date: {
        $gte: start,
        $lte: end,
      },
      timeSlots: {
        $elemMatch: {
          isBooked: false,
        },
      },
    }).populate("doctor", "firstName lastName specialistCategory")
      .sort({ date: 1 });

    console.log(`Found ${availabilities.length} availabilities with available slots`);

    // Group by date and count available slots
    const availableDates = availabilities.reduce((acc, availability) => {
      const dateStr = availability.date.toISOString().split('T')[0];
      const availableSlots = availability.timeSlots.filter(slot => !slot.isBooked);
      
      if (availableSlots.length > 0) {
        if (!acc[dateStr]) {
          acc[dateStr] = {
            date: dateStr,
            availableSlots: 0,
            doctors: [],
          };
        }
        acc[dateStr].availableSlots += availableSlots.length;
        
        // Avoid duplicate doctors for the same date
        const existingDoctor = acc[dateStr].doctors.find(
          d => d.id === availability.doctor._id.toString()
        );
        
        if (!existingDoctor) {
          acc[dateStr].doctors.push({
            id: availability.doctor._id,
            name: `${availability.doctor.firstName} ${availability.doctor.lastName}`,
            availableSlots: availableSlots.length,
          });
        } else {
          existingDoctor.availableSlots += availableSlots.length;
        }
      }
      
      return acc;
    }, {});

    const sortedDates = Object.values(availableDates).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    console.log(`Returning ${sortedDates.length} available dates`);

    res.status(200).json({
      success: true,
      data: sortedDates,
      totalAvailableDates: sortedDates.length,
      totalSlots: sortedDates.reduce((sum, date) => sum + date.availableSlots, 0),
    });
  } catch (error) {
    console.error("Error fetching available dates:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching available dates",
      error: error.message,
    });
  }
};

// Get doctor's own availability for a specific date
const getDoctorAvailability = async (req, res) => {
  try {
    const { date } = req.query;
    const doctorId = req.user._id;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date is required",
      });
    }

    const requestDate = new Date(date);
    const startOfDay = new Date(requestDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(requestDate);
    endOfDay.setHours(23, 59, 59, 999);

    const availability = await Availability.findOne({
      doctor: doctorId,
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });

    res.status(200).json({
      success: true,
      data: availability,
    });
  } catch (error) {
    console.error("Error fetching doctor availability:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch availability",
    });
  }
};

// Get doctor's availability for a date range (for calendar visualization)
const getDoctorAvailabilityRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const doctorId = req.user._id;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required",
      });
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    console.log(`Fetching availability range for doctor ${doctorId} from ${start} to ${end}`);

    const availabilities = await Availability.find({
      doctor: doctorId,
      date: {
        $gte: start,
        $lte: end,
      },
    }).sort({ date: 1 });

    console.log(`Found ${availabilities.length} availability records`);

    res.status(200).json({
      success: true,
      data: availabilities,
    });
  } catch (error) {
    console.error("Error fetching doctor availability range:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch availability range",
    });
  }
};

module.exports = {
  setAvailability,
  getAvailableSlots,
  getAvailableDates,
  bookAppointment,
  cancelAppointment,
  getUserAppointments,
  getDoctorAvailability,
  getDoctorAvailabilityRange,
};
