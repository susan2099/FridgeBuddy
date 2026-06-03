import { Oval } from "react-loader-spinner";

interface LoadingSpinnerProps {
	visible: boolean
	mainColor?: string
	backgroundColor?: string
}

export function LoadingSpinner({
	visible,
	mainColor = "#0f0fba",
	backgroundColor = "#cacaff"
}: LoadingSpinnerProps) {
	return (
		<Oval
			visible={visible}
			height="10vh"
			width="10vw"
			color={mainColor}
			secondaryColor={backgroundColor}
			ariaLabel="oval-loading"
			wrapperStyle={{}}
			wrapperClass=""
		/>
	);
}