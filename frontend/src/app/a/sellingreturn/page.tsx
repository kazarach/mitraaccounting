import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import SellingReturnArchive from "./tabledata";

const SellingReturnArchive1 = () => {
  return (
    <div className="flex justify-left w-full pt-4">
      <Card className="w-full mx-4">
        <CardHeader>
          <CardTitle>Arsip Retur Penjualan</CardTitle>
        </CardHeader>
        <CardContent>
          <SellingReturnArchive />
        </CardContent>
      </Card>
    </div>
  );
};

export default SellingReturnArchive1; 