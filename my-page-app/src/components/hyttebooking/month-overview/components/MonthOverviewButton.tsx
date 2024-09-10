type Props = {
    onClick: () => void;
    title: string;
    variant: "blue" | "orange" | "blue_small" | "yellow" | "red" | "gray" | "red_not_available";
}

const MonthOverviewButton = ({ onClick, title, variant }: Props) => {

    let className = "";

    switch (variant) {
        case "blue": {
            className = "mb-1 ml-3 bg-blue-500 text-white px-2 py-0.5 rounded-md";
            break;
        }
        case "orange": {
            className = "mt-2 ml-2 bg-orange-500 text-white px-1.5 py-0.5 rounded-md";
            break;
        }
        case "blue_small": {
            className = "mt-3 bg-blue-small-appartment text-white px-2 py-1 rounded-md";
            break;
        }
        case "yellow": {
            className = "mt-3 ml-2 bg-yellow-hotel text-white px-2 py-0.5 rounded-md";
            break;
        }
        case "red": {
            className = "mb-1 ml-2 bg-red-500 text-white px-2 py-0.5 rounded-md";
            break;
        }
        case "red_not_available": {
            className = "mt-2 ml-2 bg-red-not-available text-white px-1.5 py-0.5 rounded-md";
            break;
        }
        case "gray": {
            className = "ml-3 bg-gray-300 text-black-nav px-2 py-0.5 rounded-md";
            break;
        }
        default: {
            break;
        }
    }


    return (
        <button onClick={onClick} className={className}>
            {title}
        </button>
    );

};







export default MonthOverviewButton;
