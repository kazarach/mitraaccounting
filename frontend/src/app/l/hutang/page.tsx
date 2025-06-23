
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import HutangTable from './tabledata';
const Hutang= () => {
    return (
        <div className="flex justify-center w-full pt-4">
            <Card className="w-full mx-4">
                <CardHeader>
                    <CardTitle>Hutang</CardTitle>
                </CardHeader>
                <CardContent>
                    <HutangTable/>
                </CardContent>
            </Card>
        </div>
    );
};

export default Hutang; 