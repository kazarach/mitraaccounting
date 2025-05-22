import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import FastMoving from "./tabledata";

const FastMoving1 = () => {
  return (
    <div className="flex justify-left w-full pt-4">
      <Card className="w-full mx-4">
        <CardHeader>
          <CardTitle>Laporan Fast Moving</CardTitle>
        </CardHeader>
        <CardContent>
          <FastMoving />
        </CardContent>
      </Card>
    </div>
  );
};

export default FastMoving1; 