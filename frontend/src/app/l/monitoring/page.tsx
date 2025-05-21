import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import MonitoringReport from "./tabledata";

const Monitoring1 = () => {
  return (
    <div className="flex justify-left w-full pt-4">
      <Card className="w-full mx-4">
        <CardHeader>
          <CardTitle>Pantauan Stok dan Pesanan</CardTitle>
        </CardHeader>
        <CardContent>
          <MonitoringReport />
        </CardContent>
      </Card>
    </div>
  );
};

export default Monitoring1; 