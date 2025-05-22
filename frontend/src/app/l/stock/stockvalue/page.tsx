import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import StockValue1 from "./tabledata";

const StockValue = () => {
  return (
    <div className="flex justify-left w-full pt-4">
      <Card className="w-full mx-4">
        <CardHeader>
          <CardTitle>Nilai Stok Persediaan</CardTitle>
        </CardHeader>
        <CardContent>
          <StockValue1 />
        </CardContent>
      </Card>
    </div>
  );
};

export default StockValue; 