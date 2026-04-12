import { useState } from "react";
import { Card } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { PerimetryForm } from "./PerimetryForm";
import { SkinfoldForm } from "./SkinfoldForm";
import { DiameterForm } from "./DiameterForm";

export interface PerimetryData {
  shoulder: string;
  chest: string;
  waist: string;
  abdomen: string;
  hip: string;
  rightArmRelaxed: string;
  rightArmContracted: string;
  leftArmRelaxed: string;
  leftArmContracted: string;
  rightForearm: string;
  leftForearm: string;
  rightProximalThigh: string;
  rightMedialThigh: string;
  leftProximalThigh: string;
  leftMedialThigh: string;
  rightCalf: string;
  leftCalf: string;
}

export interface SkinfoldData {
  subscapular: string;
  biceps: string;
  triceps: string;
  chest: string;
  midaxillary: string;
  suprailiac: string;
  thigh: string;
  abdominal: string;
  calf: string;
  iliacCrest: string;
  supraspinale: string;
}

export interface DiameterData {
  wrist: string;
  femur: string;
  humerus: string;
}

interface MeasurementTabsProps {
  perimetryData: PerimetryData;
  skinfoldData: SkinfoldData;
  diameterData: DiameterData;
  onPerimetryChange: (data: PerimetryData) => void;
  onSkinfoldChange: (data: SkinfoldData) => void;
  onDiameterChange: (data: DiameterData) => void;
  onTabChange?: (tab: "perimetry" | "skinfold" | "diameter") => void;
  clientAge?: number;
  clientSex?: string;
}

export function MeasurementTabs({
  perimetryData,
  skinfoldData,
  diameterData,
  onPerimetryChange,
  onSkinfoldChange,
  onDiameterChange,
  onTabChange,
  clientAge,
  clientSex,
}: MeasurementTabsProps) {
  return (
    <Card className="shadow-card overflow-hidden">
      <Tabs 
        defaultValue="perimetry" 
        className="w-full"
        onValueChange={(value) => onTabChange?.(value as "perimetry" | "skinfold" | "diameter")}
      >
        <TabsList className="w-full grid grid-cols-3 rounded-t-2xl rounded-b-none h-auto p-0 bg-muted/30">
          <TabsTrigger
            value="perimetry"
            className="rounded-tl-2xl rounded-tr-none data-[state=active]:bg-card data-[state=active]:shadow-sm py-2 md:py-3 text-xs md:text-sm"
          >
            Perimetria
          </TabsTrigger>
          <TabsTrigger
            value="skinfold"
            className="rounded-none data-[state=active]:bg-card data-[state=active]:shadow-sm py-2 md:py-3 text-xs md:text-sm"
          >
            Dobras
          </TabsTrigger>
          <TabsTrigger
            value="diameter"
            className="rounded-tr-2xl rounded-tl-none data-[state=active]:bg-card data-[state=active]:shadow-sm py-2 md:py-3 text-xs md:text-sm"
          >
            Diâmetros
          </TabsTrigger>
        </TabsList>

        <TabsContent value="perimetry" className="p-3 md:p-6 mt-0">
          <PerimetryForm data={perimetryData} onChange={onPerimetryChange} />
        </TabsContent>

        <TabsContent value="skinfold" className="p-3 md:p-6 mt-0">
          <SkinfoldForm data={skinfoldData} onChange={onSkinfoldChange} clientAge={clientAge} clientSex={clientSex} />
        </TabsContent>

        <TabsContent value="diameter" className="p-3 md:p-6 mt-0">
          <DiameterForm data={diameterData} onChange={onDiameterChange} />
        </TabsContent>
      </Tabs>
    </Card>
  );
}
