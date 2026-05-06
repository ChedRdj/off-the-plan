"use client";

const MOTIVATIONAL = [
  "Every great listing starts with a great story.",
  "Your next deal is one upload away.",
  "Consistency builds empires.",
  "Great things are built one project at a time.",
  "Today is a good day to close a deal.",
  "Success favours the well-listed.",
  "Your portfolio grows when you show up.",
];

export function DashboardGreetingDate() {
  const today = new Date().toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const motivational = MOTIVATIONAL[new Date().getDay() % MOTIVATIONAL.length];

  return { today, motivational };
}

export function LiveDate() {
  const today = new Date().toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return <span>{today}</span>;
}

export function LiveMotivational({ quotes }: { quotes: string[] }) {
  const quote = quotes[new Date().getDay() % quotes.length];
  return <span>{quote}</span>;
}
