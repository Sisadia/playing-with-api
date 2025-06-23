const fs = require('fs');
const faker = require('faker'); // version 5.5.3

const NUM_RECORDS = 2; // change this as needed

const header = `"Employee Id","First Name","Last Name","Email Address"\n`;
let rows = '';
const usedEmails = new Set();

function generateUniqueEmail(firstName, lastName) {
  let email;
  let counter = 0;

  do {
    const suffix = counter === 0 ? '' : counter;
    email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${suffix}@yopmail.com`;
    counter++;
  } while (usedEmails.has(email));

  usedEmails.add(email);
  return email;
}

const usedEmployeeIds = new Set();

function generateUniqueEmployeeId() {
  let id;
  do {
    id = `HAYHAH${Math.floor(1000 + Math.random() * 9000)}`;
  } while (usedEmployeeIds.has(id));
  usedEmployeeIds.add(id);
  return id;
}

for (let i = 0; i < NUM_RECORDS; i++) {
  const firstName = faker.name.firstName();
  const lastName = faker.name.lastName();
  const employeeId = generateUniqueEmployeeId();
  const email = generateUniqueEmail(firstName, lastName);

  rows += `"${employeeId}","${firstName}","${lastName}","${email}"\n`;
}

// Write to temp.csv
fs.writeFileSync('temp.csv', header + rows);
console.log(`✅ temp.csv generated with ${NUM_RECORDS} unique records.`);