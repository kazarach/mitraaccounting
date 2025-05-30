import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import OpnameTable from "./opnametabledata";

const OpnameStock = () => {
  return (
    <div className="flex justify-left w-auto pt-4">
      <Card className="w-full mx-4">
        <CardHeader>
          <CardTitle>Opname Persediaan</CardTitle>
        </CardHeader>
        <CardContent>
          <OpnameTable tableName='opname' />
        </CardContent>
      </Card>
    </div>
  );
};

export default OpnameStock; 