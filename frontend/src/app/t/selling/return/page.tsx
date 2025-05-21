import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ReturnSellingTable from "./returntabledata";

const SellingTransaction = () => {
  return (
    <div className="flex justify-left w-auto pt-4">
      <Card className="w-full mx-4">
        <CardHeader>
          <CardTitle>Return Penjualan</CardTitle>
        </CardHeader>
        <CardContent>
          <ReturnSellingTable tableName='s_return' />
        </CardContent>
      </Card>
    </div>
  );
};

export default SellingTransaction; 