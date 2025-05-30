import { google } from "googleapis";
import { GoogleAuth } from "google-auth-library";

export const createCalendarEvent = async (eventDetails: any) => {
  const serviceAccount = require(process.env.GOOGLE_CREDENTIALS_PATH!);

  if (!serviceAccount) {
    console.error("Error: GOOGLE_CREDENTIALS_JSON is not set.");
    console.error(
      "Please set the environment variable with your service account key JSON content."
    );
    process.exit(1);
  }

  const auth = new GoogleAuth({
    credentials: {
      client_email: serviceAccount.client_email,
      private_key: serviceAccount.private_key,
    },
    scopes: ["https://www.googleapis.com/auth/calendar.events"],
  });

  const calendar = google.calendar({ version: "v3", auth });

  const event = {
    summary: "Meeting with AIESEC team",
    location: "Zoom",
    description: "Weekly sync with the project team.",
    start: {
      dateTime: "2025-06-01T10:00:00+02:00", // ISO string with timezone offset
      timeZone: "Europe/Rome",
    },
    end: {
      dateTime: "2025-06-01T11:00:00+02:00",
      timeZone: "Europe/Rome",
    },
    attendees: [
      { email: "person1@example.com" },
      { email: "person2@example.com" },
    ],
    reminders: {
      useDefault: false,
      overrides: [
        { method: "email", minutes: 60 },
        { method: "popup", minutes: 10 },
      ],
    },
  };

  try {
    const response: any = calendar.events.insert(
      {
        calendarId: "primary", // or another calendar's ID
        requestBody: eventDetails,
        sendUpdates: "all", // notify attendees via email
      },
      (err: any, res: any) => {
        if (err) {
          console.error("Error creating event:", err);
          return;
        }
        console.log("Event created: %s", res.data.htmlLink);
      }
    );

    // console.log("Event created:", response.data);
    // console.log("Event Link:", response.data.htmlLink);
    // if (
    //   response.data.conferenceData &&
    //   response.data.conferenceData.conferenceUri
    // ) {
    //   console.log(
    //     "Google Meet Link:",
    //     response.data.conferenceData.conferenceUri
    //   );
    // }
    // return response.data;
    console.log(response);
  } catch (error: any) {
    console.error(
      "Error creating calendar event:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};
