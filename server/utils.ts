// Helper function to get color class based on specialty
export function getColorClass(specialty: string): string {
  const colorMap: Record<string, string> = {
    "Cardiology": "bg-primary/20 text-primary",
    "Neurology": "bg-secondary/20 text-secondary",
    "Infectious Disease": "bg-green-100 text-green-600",
    "Pulmonology": "bg-accent/20 text-accent/80"
  };

  return colorMap[specialty] || "bg-gray-200 text-gray-600";
}
