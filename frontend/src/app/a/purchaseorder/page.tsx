import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import PurchaseOrderArchive from "./tabledata";

const PurchaseOrderArchive1 = () => {
  return (
    <div className="flex justify-left w-full pt-4">
      <Card className="w-full mx-4">
        <CardHeader>
          <CardTitle>Arsip Pesanan Pembelian</CardTitle>
        </CardHeader>
        <CardContent>
          <PurchaseOrderArchive />
        </CardContent>
      </Card>
    </div>
  );
};

export default PurchaseOrderArchive1; 