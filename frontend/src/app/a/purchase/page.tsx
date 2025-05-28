import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import PurchaseArchive from "./tabledata";

const PurchaseArchive1 = () => {
  return (
    <div className="flex justify-left w-full pt-4">
      <Card className="w-full mx-4">
        <CardHeader>
          <CardTitle>Arsip Pembelian</CardTitle>
        </CardHeader>
        <CardContent>
          <PurchaseArchive />
        </CardContent>
      </Card>
    </div>
  );
};

export default PurchaseArchive1; 