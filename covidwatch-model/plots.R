library(ggplot2)
# source('./covidwatch-model.R')

filename = "./output/infection-curve-1.tiff"

config.default = list(
  nTrials = 10,
  maxNTrials = 20,
  toggleIntervention = F,
  
  # model config
  nPlaces = 6,
  nPeople = 40,
  totalTime = 20,
  initialInfected = 0.05,
  activeTime = 8,
  infectionProb = 0.25,
  diagnosisPeriod = 2,
  isolationCompliance = 1,
  
  # intervention config
  estimatedDiagnosisPeriod = 2,
  estimatedActiveTime = 8,
  interventionUsage = 0.5
)

config.intervention.25 = config.default
config.intervention.25$toggleIntervention = T
config.intervention.25$interventionUsage = 0.25

config.intervention.50 = config.default
config.intervention.50$toggleIntervention = T
config.intervention.50$interventionUsage = 0.5

config.intervention.75 = config.default
config.intervention.75$toggleIntervention = T
config.intervention.75$interventionUsage = 0.75

curve.default = modelFn(config.default)$infectionCurve
curve.intervention.25 = modelFn(config.intervention.25)$infectionCurve
curve.intervention.50 = modelFn(config.intervention.50)$infectionCurve
curve.intervention.75 = modelFn(config.intervention.75)$infectionCurve

curve.default$scenario = 'No adoption'
curve.intervention.25$scenario = '25% adoption'
curve.intervention.50$scenario = '50% adoption'
curve.intervention.75$scenario = '75% adoption'

curve.default$group = paste(curve.default$trial, curve.default$scenario)
curve.intervention.25$group = paste(curve.intervention.25$trial, curve.intervention.25$scenario)
curve.intervention.50$group = paste(curve.intervention.50$trial, curve.intervention.50$scenario)
curve.intervention.75$group = paste(curve.intervention.75$trial, curve.intervention.75$scenario)

curve.combined = rbind(
  curve.default,
  curve.intervention.25,
  curve.intervention.50,
  curve.intervention.75
)

scenarios = c('No adoption', '25% adoption', '50% adoption', '75% adoption')

tiff(filename, units="in", width=5, height=3.5, res=300)
ggplot(curve.combined, aes(x=time, y=active, group=factor(group), color=factor(scenario, scenarios))) +
  geom_line() +
  scale_colour_manual(values=c('#EF476F', '#FFD166', '#06D6A0', '#118AB2')) +
  ylim(0,1) +
  labs(x="Time",
       y="Proportion of population with active infection",
       color="App Adoption") +
  theme(axis.title=element_text(size=10))
dev.off()
