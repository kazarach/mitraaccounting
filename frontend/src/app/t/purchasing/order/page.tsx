
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import OrderTransTable from './tabledata';

const OrderPurchase = () => {


  return (
    <div className="flex justify-left w-auto pt-4">
      <Card className="w-full mx-4">
        <CardHeader>
          <CardTitle>Pesanan Pembelian</CardTitle>
        </CardHeader>
        <CardContent>
          <OrderTransTable tableName='order'/>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderPurchase; 