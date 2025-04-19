
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import ReturTransTable from './tabledata';

const ReturnPurchase = () => {
  return (
    <div className="flex justify-center w-full pt-4">
      <Card className="w-full mx-4">
        <CardHeader>
          <CardTitle>Return Pembelian</CardTitle>
        </CardHeader>
        <CardContent>
          <ReturTransTable tableName='return'/>
        </CardContent>
      </Card>
    </div >
  );
};

export default ReturnPurchase; 