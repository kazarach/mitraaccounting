import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import PurchasingReport from "./tabledata";

const PurchasingReport1 = () => {
  return (
    <div className="flex justify-left w-full pt-4">
      <Card className="w-full mx-4">
        <CardHeader>
          <CardTitle>Laporan Pembelian</CardTitle>
        </CardHeader>
        <CardContent>
          <PurchasingReport />
        </CardContent>
      </Card>
    </div>
  );
};

export default PurchasingReport1; 