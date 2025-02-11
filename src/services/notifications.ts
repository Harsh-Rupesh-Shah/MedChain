import { toast } from 'react-hot-toast';

export const sendAppointmentReminder = async (appointment: any) => {
  // Send email/SMS reminder
  console.log('Sending reminder for appointment:', appointment);
  
  // Show notification
  toast.success(`Reminder: You have an appointment with ${appointment.doctorName} tomorrow at ${appointment.time}`);
};

export const scheduleReminders = (appointment: any) => {
  // Schedule reminders for 24h and 1h before appointment
  const appointmentTime = new Date(appointment.date + ' ' + appointment.time);
  const dayBefore = new Date(appointmentTime.getTime() - 24 * 60 * 60 * 1000);
  const hourBefore = new Date(appointmentTime.getTime() - 60 * 60 * 1000);

  // Set timeouts for reminders
  setTimeout(() => {
    sendAppointmentReminder(appointment);
  }, dayBefore.getTime() - Date.now());

  setTimeout(() => {
    sendAppointmentReminder(appointment);
  }, hourBefore.getTime() - Date.now());
};