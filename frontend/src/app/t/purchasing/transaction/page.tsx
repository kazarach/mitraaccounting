import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import TransactionTable from './tabledata';

const TransactionPurchase = () => {
  return (
    <div className="flex justify-center w-full pt-4">
      <Card className="w-full mx-4 ">
        <CardHeader>
          <CardTitle>Transaksi Pembelian</CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionTable tableName='transaksi'/>
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionPurchase; 