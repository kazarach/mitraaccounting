import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import StockUses from "./tabledata";



const UseStock = () => {
  return (
    <div className="flex justify-left w-auto pt-4">
      <Card className="w-full mx-4">
        <CardHeader>
          <CardTitle>Opname Persediaan</CardTitle>
        </CardHeader>
        <CardContent>
          <StockUses tableName="usestock"/>
        </CardContent>
      </Card>
    </div>
  );
};

export default UseStock; 