import { Cell } from "./cell";

function parsePresetAsCells(preset: string): Cell[][] {
  return preset.split("\n").map((line) => {
    return line.split("").map((char) => {
      if (char === " ") {
        return "dead" as const;
      }
      if (char === "x") {
        return "alive" as const;
      }
      throw new Error(`invalid char: ${char}`);
    });
  });
}

const blinker = {
  name: "Blinker",
  cells: `\
     
  x  
  x  
  x  
     
`,
};

const beacon = {
  name: "Beacon",
  cells: `\
        
  xx    
  xx    
    xx  
    xx  
        
`,
};

const gliderGun = {
  name: "Glider Gun",
  cells: `\
                                      
                         x            
                       x x            
             xx      xx            xx 
            x   x    xx            xx 
 xx        x     x   xx               
 xx        x   x xx    x x            
           x     x       x            
            x   x                     
             xx                       
                                      
                                      
                                      
                                      
                                      
                                      
                                      
                                      
                                      
                                      
                                      
                                      
                                      
`,
};

type Preset = {
  name: string;
  cells: Cell[][];
};

export const PRESETS: Preset[] = [blinker, beacon, gliderGun].map((it) => ({
  ...it,
  cells: parsePresetAsCells(it.cells),
}));
