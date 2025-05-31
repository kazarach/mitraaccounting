import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import OpnameReport from "./tabledata";

const OpnameReport1 = () => {
  return (
    <div className="flex justify-left w-full pt-4">
      <Card className="w-full mx-4">
        <CardHeader>
          <CardTitle>Arsip Opname Persediaan</CardTitle>
        </CardHeader>
        <CardContent>
          <OpnameReport />
        </CardContent>
      </Card>
    </div>
  );
};

export default OpnameReport1; 