
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import KasBankTransTable from "./tabledata";
const KasBankTrans = () => {
    return (
        <div className="flex justify-center items-center w-full pt-4">
            <Card className="w-1/3 mx-4">
                <CardHeader>
                    <CardTitle>Transaksi Kas dan Bank</CardTitle>
                </CardHeader>
                <CardContent>
                    <KasBankTransTable/>
                </CardContent>
            </Card>
        </div>
    );
};

export default KasBankTrans; 