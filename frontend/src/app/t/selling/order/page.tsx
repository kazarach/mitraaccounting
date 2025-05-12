import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import TransactionOrderSellingTable from "./tabledata";

const OrderTransaction = () => {
  return (
    <div className="flex justify-center w-full pt-4">
      <Card className="w-full mx-4">
        <CardHeader>
          <CardTitle>Pesanan Penjualan</CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionOrderSellingTable tableName='s_pesanan' />
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderTransaction; 