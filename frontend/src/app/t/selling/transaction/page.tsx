import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import TransactionSellingTable from "./tabledata";

const SellingTransaction = () => {
  return (
    <div className="flex justify-left w-auto pt-4">
      <Card className="w-full mx-4">
        <CardHeader>
          <CardTitle>Transaksi Penjualan</CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionSellingTable tableName='s_transaksi' />
        </CardContent>
      </Card>
    </div>
  );
};

export default SellingTransaction; 