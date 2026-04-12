const crypto = require('crypto');

const uniqueSuffix = () => `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

const createUserVars = (role, prefix) => {
  const suffix = uniqueSuffix();
  return {
    firstName: prefix,
    lastName: 'Perf',
    email: `${prefix.toLowerCase()}-${suffix}@example.com`,
    password: 'Password123!',
    role,
    employeeId: `${prefix.toUpperCase()}-${suffix}`
  };
};

function setWorkerRegistrationData(context, events, done) {
  const worker = createUserVars('worker', 'worker');
  Object.assign(context.vars, {
    workerFirstName: worker.firstName,
    workerLastName: worker.lastName,
    workerEmail: worker.email,
    workerPassword: worker.password,
    workerRole: worker.role,
    workerEmployeeId: worker.employeeId
  });
  return done();
}

function setTrainerRegistrationData(context, events, done) {
  const trainer = createUserVars('trainer', 'trainer');
  Object.assign(context.vars, {
    trainerFirstName: trainer.firstName,
    trainerLastName: trainer.lastName,
    trainerEmail: trainer.email,
    trainerPassword: trainer.password,
    trainerRole: trainer.role,
    trainerEmployeeId: trainer.employeeId,
    courseTitle: `Performance Course ${uniqueSuffix()}`
  });
  return done();
}

module.exports = {
  setWorkerRegistrationData,
  setTrainerRegistrationData
};