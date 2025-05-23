import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import SellingItems from "./tabledata";

const SellingItem1 = () => {
  return (
    <div className="flex justify-left w-full pt-4">
      <Card className="w-full mx-4">
        <CardHeader>
          <CardTitle>Laporan Penjualan Per Barang</CardTitle>
        </CardHeader>
        <CardContent>
          <SellingItems />
        </CardContent>
      </Card>
    </div>
  );
};

export default SellingItem1; 