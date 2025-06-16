
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import PiutangTable from './tabledata';
const Piutang = () => {
    return (
        <div className="flex justify-center w-full pt-4">
            <Card className="w-full mx-4">
                <CardHeader>
                    <CardTitle>Piutang</CardTitle>
                </CardHeader>
                <CardContent>
                    <PiutangTable/>
                </CardContent>
            </Card>
        </div>
    );
};

export default Piutang; 