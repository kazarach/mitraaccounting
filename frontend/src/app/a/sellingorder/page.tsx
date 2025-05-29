import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import SellingOrderArchive from "./tabledata";

const SellingOrderArchive1 = () => {
  return (
    <div className="flex justify-left w-full pt-4">
      <Card className="w-full mx-4">
        <CardHeader>
          <CardTitle>Arsip Pesanan Penjualan</CardTitle>
        </CardHeader>
        <CardContent>
          <SellingOrderArchive />
        </CardContent>
      </Card>
    </div>
  );
};

export default SellingOrderArchive1; 