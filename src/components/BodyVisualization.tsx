import { Circle } from "lucide-react";
import maleBodyImage from "@/assets/homem.png";
import femaleBodyImage from "@/assets/mulher.png";

interface BodyVisualizationProps {
  measurementType: "perimetry" | "skinfold" | "diameter";
  sex: string;
}

export function BodyVisualization({ measurementType, sex }: BodyVisualizationProps) {
  const getMarkers = () => {
    switch (measurementType) {
      case "perimetry":
        return [
          { id: "shoulder", top: "15%", left: "50%", label: "Ombro" },
          { id: "chest", top: "23%", left: "50%", label: "Tórax" },
          { id: "waist", top: "33%", left: "50%", label: "Cintura" },
          { id: "abdomen", top: "38%", left: "50%", label: "Abdômen" },
          { id: "hip", top: "46%", left: "50%", label: "Quadril" },
          { id: "arm", top: "28%", left: "23%", label: "Braço" },
          { id: "forearm", top: "40%", left: "18%", label: "Antebraço" },
          { id: "thigh", top: "58%", left: "44%", label: "Coxa" },
          { id: "calf", top: "78%", left: "44%", label: "Panturrilha" },
        ];
      case "skinfold":
        return [
          { id: "subscapular", top: "26%", left: "60%", label: "Subescapular" },
          { id: "triceps", top: "30%", left: "73%", label: "Tríceps" },
          { id: "biceps", top: "30%", left: "27%", label: "Bíceps" },
          { id: "midaxillary", top: "30%", left: "64%", label: "Axilar Média" },
          { id: "suprailiac", top: "40%", left: "62%", label: "Supra-ilíaca" },
          { id: "abdominal", top: "38%", left: "46%", label: "Abdominal" },
          { id: "thigh", top: "58%", left: "46%", label: "Coxa" },
          { id: "calf", top: "78%", left: "46%", label: "Panturrilha" },
        ];
      case "diameter":
        return [
          { id: "wrist", top: "42%", left: "14%", label: "Punho" },
          { id: "femur", top: "54%", left: "50%", label: "Fêmur" },
          { id: "humerus", top: "26%", left: "20%", label: "Úmero" },
        ];
    }
  };

  const markers = getMarkers();

  return (
    <div className="relative w-full h-[400px] flex items-center justify-center">
      {/* Imagem do corpo humano */}
      <div className="relative w-48 h-full">
        <img
          src={sex === "F" ? femaleBodyImage : maleBodyImage}
          alt="Corpo humano"
          className="w-full h-full object-contain"
        />

        {/* Marcadores de medição */}
        {markers.map((marker) => (
          <div
            key={marker.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 group"
            style={{ top: marker.top, left: marker.left }}
          >
            <div className="relative">
              <Circle
                className="w-4 h-4 fill-primary text-primary animate-pulse"
                strokeWidth={2}
              />
              <div className="absolute left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                <div className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium">
                  {marker.label}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
