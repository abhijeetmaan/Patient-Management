export const getVisitActivities = (patients) => {
  return patients
    .flatMap((patient) => {
      const visits = Array.isArray(patient.visits) ? patient.visits : [];
      return visits.map((visit, index) => ({
        id: `${patient.id}-${visit.date}-${index}`,
        patientId: patient.id,
        patientName: patient.name,
        date: visit.date,
        diagnosis: visit.diagnosis,
      }));
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const getDashboardStats = (patients, visitActivities) => {
  const totalPatients = patients.length;
  const totalVisits = visitActivities.length;
  const now = Date.now();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  const activePatients = patients.filter((patient) => {
    const latestVisitDate = patient?.visits?.[0]?.date;
    if (!latestVisitDate) {
      return false;
    }

    const timestamp = new Date(latestVisitDate).getTime();
    return !Number.isNaN(timestamp) && now - timestamp <= thirtyDaysMs;
  }).length;

  const recentActivity = visitActivities.filter((activity) => {
    const timestamp = new Date(activity.date).getTime();
    return !Number.isNaN(timestamp) && now - timestamp <= sevenDaysMs;
  }).length;

  return {
    totalPatients,
    totalVisits,
    activePatients,
    recentActivity,
  };
};

const toDayKey = (rawDate) => {
  const parsedDate = new Date(rawDate);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
  const day = String(parsedDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatDayLabel = (dayKey) => {
  const [year, month, day] = String(dayKey).split("-").map(Number);
  const parsedDate = new Date(year, month - 1, day);
  if (Number.isNaN(parsedDate.getTime())) {
    return dayKey;
  }

  return parsedDate.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};

export const getVisitsPerDayData = (visitActivities) => {
  const grouped = visitActivities.reduce((accumulator, activity) => {
    const dayKey = toDayKey(activity.date);
    if (!dayKey) {
      return accumulator;
    }

    accumulator.set(dayKey, (accumulator.get(dayKey) || 0) + 1);
    return accumulator;
  }, new Map());

  return [...grouped.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, visits]) => ({
      day,
      dateLabel: formatDayLabel(day),
      visits,
    }));
};

export const getPatientGrowthData = (patients) => {
  const grouped = patients.reduce((accumulator, patient) => {
    const dayKey = toDayKey(patient.createdAt || patient?.visits?.[0]?.date);
    if (!dayKey) {
      return accumulator;
    }

    accumulator.set(dayKey, (accumulator.get(dayKey) || 0) + 1);
    return accumulator;
  }, new Map());

  let runningTotal = 0;

  return [...grouped.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, addedPatients]) => {
      runningTotal += addedPatients;

      return {
        day,
        dateLabel: formatDayLabel(day),
        totalPatients: runningTotal,
      };
    });
};
