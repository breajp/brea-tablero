import "./index.css";
import { montar } from "./montar-app";

// Un solo bundle a propósito: el tablero se publica también como un único archivo HTML.
montar(document.getElementById("root")!);
