require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const connectDB = require('./config/db');

// Permanent user accounts
const permanentUsers = [
  {
    firstName: 'John',
    lastName: 'Manager',
    email: 'manager@safebuild.com',
    password: 'manager123',
    role: 'manager',
    phone: '+1234567890',
    department: 'Management',
    employeeId: 'MGR001',
    isActive: true
  },
  {
    firstName: 'Sarah',
    lastName: 'Officer',
    email: 'officer@safebuild.com',
    password: 'officer123',
    role: 'officer',
    phone: '+1234567891',
    department: 'Safety',
    employeeId: 'OFF001',
    isActive: true
  },
  {
    firstName: 'Mike',
    lastName: 'Trainer',
    email: 'trainer@safebuild.com',
    password: 'trainer123',
    role: 'trainer',
    phone: '+1234567892',
    department: 'Training',
    employeeId: 'TRN001',
    isActive: true
  },
  {
    firstName: 'Safety',
    lastName: 'Compliance Manager',
    email: 'safety.compliance.manager@safebuild.com',
    password: 'scm12345',
    role: 'safety-compliance-manager',
    phone: '+1234567893', // optional, you can adjust
    department: 'Safety Compliance',
    employeeId: 'SCM-001',
    isActive: true
  }
];

/**
 * Seed permanent users into database
 */
const seedUsers = async () => {
  try {
    // Connect to database
    await connectDB();

    console.log('🌱 Starting seed process...\n');

    // Check if users already exist
    for (const userData of permanentUsers) {
      const existingUser = await User.findOne({ email: userData.email });
      
      if (existingUser) {
        console.log(`⏭️  User ${userData.email} already exists, skipping...`);
      } else {
        const user = await User.create(userData);
        console.log(`✅ Created ${userData.role}: ${user.firstName} ${userData.lastName} (${user.email})`);
      }
    }

    console.log('\n✨ Seed process completed successfully!\n');
    console.log('📋 Permanent User Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Manager:');
    console.log('  Email: manager@safebuild.com');
    console.log('  Password: manager123');
    console.log('');
    console.log('Safety Officer:');
    console.log('  Email: officer@safebuild.com');
    console.log('  Password: officer123');
    console.log('');
    console.log('Trainer:');
    console.log('  Email: trainer@safebuild.com');
    console.log('  Password: trainer123');
    console.log('');
    console.log('Safety Compliance Manager:');
    console.log('  Email: safety.compliance.manager@safebuild.com');
    console.log('  Password: scm12345');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding users:', error.message);
    process.exit(1);
  }
};

// Run seed
seedUsers();