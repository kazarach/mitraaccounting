import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import RedeemPoint from "./tabledata";

const  PointChanges= () => {
  return (
    <div className="flex justify-left w-auto pt-4">
      <Card className="w-full mx-4">
        {/* <CardHeader>
          <CardTitle>Tukar Poin</CardTitle>
        </CardHeader> */}
        <CardContent>
          <RedeemPoint />
        </CardContent>
      </Card>
    </div>
  );
};

export default PointChanges; 