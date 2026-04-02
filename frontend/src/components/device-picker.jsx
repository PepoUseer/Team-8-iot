import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Cpu } from "lucide-react"; // Icons for your IoT vibe

export function DevicePicker({ onSelect }) {
  // Start with NO devices
  const [devices, setDevices] = useState([]);

  // This is what the user sees first
  if (devices.length === 0) {
    return (
      <Card className="border-dashed py-12 text-center bg-zinc-50/50">
        <CardContent className="flex flex-col items-center gap-4">
          <div className="rounded-full bg-zinc-100 p-4">
            <Cpu className="h-10 w-10 text-zinc-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Zatím žádná zařízení</h3>
            <p className="text-sm text-muted-foreground max-w-[250px] mx-auto">
              Přidejte svůj první Air Buddy senzor, abyste mohli sledovat
              kvalitu vzduchu.
            </p>
          </div>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              /* Link this to your "Add Device" logic later */
            }}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Přidat zařízení
          </Button>
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {devices.map((device) => (
        <Card
          key={device.id}
          onClick={() => onSelect(device)}
          className="cursor-pointer"
        ></Card>
      ))}
    </div>
  );
}
