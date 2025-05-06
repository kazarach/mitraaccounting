import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import TransactionTable from './tabledata';
import { DialogHeader } from "@/components/ui/dialog";
import { DialogTitle } from "@radix-ui/react-dialog";
import TransactionSellingTable from "./tabledata";

const SellingTransaction = () => {
  return (
    <div className="flex justify-center w-full pt-4">
      <Card className="w-full mx-4 ">
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