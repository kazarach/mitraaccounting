import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import SellingReport from "./tabledata";

const SellingReport1 = () => {
  return (
    <div className="flex justify-left w-full pt-4">
      <Card className="w-full mx-4">
        <CardHeader>
          <CardTitle>Laporan Penjualan</CardTitle>
        </CardHeader>
        <CardContent>
          <SellingReport />
        </CardContent>
      </Card>
    </div>
  );
};

export default SellingReport1; 