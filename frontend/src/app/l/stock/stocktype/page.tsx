import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Stocktype from "./tabledata";

const StockType1 = () => {
  return (
    <div className="flex justify-left w-full pt-4">
      <Card className="w-full mx-4">
        <CardHeader>
          <CardTitle>Laporan Stok Perjenis</CardTitle>
        </CardHeader>
        <CardContent>
          <Stocktype />
        </CardContent>
      </Card>
    </div>
  );
};

export default StockType1; 