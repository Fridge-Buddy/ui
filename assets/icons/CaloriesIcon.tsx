import { Svg, Path } from "react-native-svg";

interface Props {
	fill?: string;
}

const CaloriesIcon = ({fill}: Props) => (
    <Svg viewBox="0 0 16 16" fill={fill}>
    <Path fillRule="evenodd" d="M9.58 1.077a.75.75 0 0 1 .405.82L9.165 6h4.085a.75.75 0 0 1 .567 1.241l-6.5 7.5a.75.75 0 0 1-1.302-.638L6.835 10H2.75a.75.75 0 0 1-.567-1.241l6.5-7.5a.75.75 0 0 1 .897-.182Z" clipRule="evenodd" />
    </Svg>
);

export default CaloriesIcon;