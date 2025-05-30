import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import SellingArchive from "./tabledata";

const SellingArchive1 = () => {
  return (
    <div className="flex justify-left w-full pt-4">
      <Card className="w-full mx-4">
        <CardHeader>
          <CardTitle>Arsip Penjualan</CardTitle>
        </CardHeader>
        <CardContent>
          <SellingArchive />
        </CardContent>
      </Card>
    </div>
  );
};

export default SellingArchive1; 