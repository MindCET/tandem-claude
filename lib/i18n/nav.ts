export type Lang = "he" | "en"

export const navLabels = {
  he: {
    controlTower: "מגדל שליטה",
    projects: "פרויקטים",
    missionBriefs: "תדריכי משימה",
    returnBriefs: "תדריכי חזרה",
    decisionLog: "יומן החלטות",
    driftDetection: "זיהוי סטייה",
    projectMemory: "זיכרון פרויקט",
    settings: "הגדרות",
    toggleLabel: "EN",
  },
  en: {
    controlTower: "Control Tower",
    projects: "Projects",
    missionBriefs: "Mission Briefs",
    returnBriefs: "Return Briefs",
    decisionLog: "Decision Log",
    driftDetection: "Drift Detection",
    projectMemory: "Project Memory",
    settings: "Settings",
    toggleLabel: "עב",
  },
} as const
