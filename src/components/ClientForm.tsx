import { useState, useRef } from "react";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Plus, Camera, Loader2 } from "lucide-react";

interface ClientData {
  name: string;
  sex: string;
  age: string;
  height: string;
  weight: string;
  observations: string;
  photo: string;
}

interface ClientFormProps {
  data: ClientData;
  onChange: (data: ClientData) => void;
  onNewAssessment: () => Promise<void> | void;
}

export function ClientForm({ data, onChange, onNewAssessment }: ClientFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleChange = (field: keyof ClientData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange({ ...data, photo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const calculateIMC = () => {
    const height = parseFloat(data.height);
    const weight = parseFloat(data.weight);
    if (height && weight) {
      const heightInMeters = height / 100;
      return (weight / (heightInMeters * heightInMeters)).toFixed(1);
    }
    return "—";
  };

  const getIMCClassification = (imc: number) => {
    if (imc < 18.5) return "Abaixo do peso";
    if (imc < 25) return "Peso normal";
    if (imc < 30) return "Sobrepeso";
    return "Obesidade";
  };

  const imc = calculateIMC();
  const imcValue = parseFloat(imc);

  const handleNewAssessmentClick = async () => {
    setIsCreating(true);
    try {
      await onNewAssessment();
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card className="p-4 md:p-6 shadow-card">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-foreground">Avaliação 1</h2>
          <p className="text-xs md:text-sm text-muted-foreground">
            {new Date().toLocaleDateString("pt-BR")}
          </p>
        </div>
        <Button
          size="sm"
          onClick={handleNewAssessmentClick}
          disabled={isCreating}
          className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {isCreating ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Plus className="w-4 h-4 mr-2" />
          )}
          {isCreating ? "Criando..." : "Nova Avaliação"}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
        <div className="col-span-1 sm:col-span-2">
          <Label htmlFor="name">Nome</Label>
          <div className="flex items-center gap-3">
            <div className="relative group">
              <Avatar className="w-12 h-12 cursor-pointer border-2 border-muted hover:border-primary transition-colors">
                <AvatarImage src={data.photo} alt={data.name || "Foto do cliente"} />
                <AvatarFallback className="bg-muted text-muted-foreground text-sm">
                  {data.name ? getInitials(data.name) : <Camera className="w-5 h-5" />}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Camera className="w-4 h-4 text-white" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>
            <Input
              id="name"
              value={data.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Nome completo"
              className="flex-1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="sex">Sexo</Label>
          <Select value={data.sex} onValueChange={(value) => handleChange("sex", value)}>
            <SelectTrigger id="sex">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="M">Masculino</SelectItem>
              <SelectItem value="F">Feminino</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="age">Idade</Label>
          <Input
            id="age"
            type="number"
            value={data.age}
            onChange={(e) => handleChange("age", e.target.value)}
            placeholder="Anos"
          />
        </div>

        <div>
          <Label htmlFor="height">Altura (cm)</Label>
          <Input
            id="height"
            type="number"
            value={data.height}
            onChange={(e) => handleChange("height", e.target.value)}
            placeholder="Ex: 175"
          />
        </div>

        <div>
          <Label htmlFor="weight">Peso (kg)</Label>
          <Input
            id="weight"
            type="number"
            step="0.1"
            value={data.weight}
            onChange={(e) => handleChange("weight", e.target.value)}
            placeholder="Ex: 70.5"
          />
        </div>

        <div className="col-span-1 sm:col-span-2 bg-muted/50 p-3 md:p-4 rounded-lg">
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div>
              <p className="text-xs md:text-sm text-muted-foreground">IMC</p>
              <p className="text-xl md:text-2xl font-bold text-foreground">{imc}</p>
            </div>
            <div>
              <p className="text-xs md:text-sm text-muted-foreground">Classificação</p>
              <p className="text-xs md:text-sm font-medium text-foreground">
                {!isNaN(imcValue) && imc !== "—" ? getIMCClassification(imcValue) : "—"}
              </p>
            </div>
          </div>
        </div>

        <div className="col-span-1 sm:col-span-2">
          <Label htmlFor="observations">Observações</Label>
          <Textarea
            id="observations"
            value={data.observations}
            onChange={(e) => handleChange("observations", e.target.value)}
            placeholder="Notas adicionais sobre o cliente..."
            rows={3}
          />
        </div>
      </div>
    </Card>
  );
}
