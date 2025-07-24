
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import KasBankTable from "./tabledata";
const KasBank = () => {
    return (
        <div className="flex justify-center w-full pt-4">
            <Card className="w-full mx-4">
                <CardHeader>
                    <CardTitle>Kas / Bank</CardTitle>
                </CardHeader>
                <CardContent>
                    <KasBankTable/>
                </CardContent>
            </Card>
        </div>
    );
};

export default KasBank; 