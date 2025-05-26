const dotenv = require('dotenv');
const mongoose = require('mongoose');
const User = require('./models/User');
const Appointment = require('./models/Appointment');

dotenv.config();

async function testAppointmentProfileImage() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    });
    console.log('MongoDB connected');

    // Find test users
    const patient = await User.findOne({ email: 'testpatient@example.com' });
    const doctor = await User.findOne({ email: 'testdoctor@example.com' });

    if (!patient || !doctor) {
      console.log('Test users not found');
      process.exit(1);
    }

    console.log('Patient profileImage:', patient.profileImage);
    console.log('Doctor profileImage:', doctor.profileImage);

    // Create a test appointment if it doesn't exist
    let appointment = await Appointment.findOne({
      patient: patient._id,
      specialist: doctor._id
    });

    if (!appointment) {
      appointment = await Appointment.create({
        patient: patient._id,
        specialist: doctor._id,
        dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        specialistCategory: 'Cardiology',
        reason: 'Test appointment for profileImage fix',
        status: 'scheduled',
        availabilitySlot: new mongoose.Types.ObjectId() // Dummy ID for test
      });
      console.log('Created test appointment');
    }

    // Test the getUserAppointments query with population
    const appointments = await Appointment.find({
      $or: [{ patient: patient._id }, { specialist: patient._id }],
    })
      .populate("patient", "firstName lastName email profileImage")
      .populate("specialist", "firstName lastName email specialistCategory profileImage");

    console.log('\n=== Appointment Data Test ===');
    appointments.forEach(apt => {
      console.log('Appointment ID:', apt._id);
      console.log('Patient:', {
        name: apt.patient ? `${apt.patient.firstName} ${apt.patient.lastName}` : 'No patient',
        profileImage: apt.patient?.profileImage || 'MISSING'
      });
      console.log('Specialist:', {
        name: apt.specialist ? `${apt.specialist.firstName} ${apt.specialist.lastName}` : 'No specialist',
        profileImage: apt.specialist?.profileImage || 'MISSING',
        category: apt.specialist?.specialistCategory || 'No category'
      });
      console.log('---');
    });

    console.log('\n✅ ProfileImage fix verification complete!');
    console.log('Both patient and specialist should have profileImage fields populated.');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testAppointmentProfileImage();
