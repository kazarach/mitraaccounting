import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import OpnameTable from "./opnametabledata";

const OpnameStock = () => {
  return (
    <div className="flex justify-center w-full pt-4">
      <Card className="w-full mx-4">
        <CardHeader>
          <CardTitle>Opname Stock</CardTitle>
        </CardHeader>
        <CardContent>
          <OpnameTable tableName='opname' />
        </CardContent>
      </Card>
    </div>
  );
};

export default OpnameStock; 