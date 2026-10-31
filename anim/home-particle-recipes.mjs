// Ambient details belong to the setting; there is no minimum number of effects.
const green=['#9bd36a','#c8e07a','#e8b04a'],gold=['#ffd24a','#ffb23e','#ffe9a0'];
export const HOME_PARTICLES={
  ants:[['pollen',10],['puff',8]],
  sunflower:[['pollen',10],['petal',5,{colors:gold}],['puff',8]],
  games:[['confetti',12],['sparkle',5]],
  house:[['fizz',12],['steam',5]],
  snacks:[['sugar',10],['heart',5]],
  town:[['paper',7],['petal',5,{colors:green}]],
  corgi:[['petal',8,{colors:green}],['pollen',6]],
  wheels:[['ember',10],['smoke',5]],
  lighthouse:[['spray',14],['bubble',6]],
  underwater:[['bubble',24],['caustic',6]],
  'toy-box':[['confetti',10],['music',6]],
  penguin:[['snow',24],['crystal',7]],
  cactus:[['sand',16],['heat',4]],
  giraffe:[['petal',7,{colors:green}],['feather',5]],
  dragon:[['ember',14],['ash',7],['mist',7]],
  space:[['star',28],['shoot',1]],
  'make-believe':[['sparkle',12,{colors:['#ffb8eb','#bceaff','#ffe08a']}],['rune',6],['mist',7]],
  'holiday-mix':[['snow',18],['heart',5],['confetti',5]],
};
export const RISING_PARTICLES=new Set(['mote','ember','bubble','pollen','seed','fizz','steam','smoke','spray','caustic','music','heat','rune']);
export const FALLING_PARTICLES=new Set(['snow','petal','confetti','sugar','heart','paper','crystal','feather','ash','puff']);
export const SIDEWAYS_PARTICLES=new Set(['sand','mist']);
