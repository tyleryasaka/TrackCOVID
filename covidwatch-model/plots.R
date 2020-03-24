library(ggplot2)
source('./covidwatch-model.R')

config.default = list(
  nTrials = 10,
  maxNTrials = 20,
  toggleIntervention = F, # enable or disable the intervention (app) in the simulation
  
  # model config
  nPlaces = 6,
  nPeople = 40,
  totalTime = 20,
  initialInfected = 0.05,
  activeTime = 8,
  infectionProb = 0.3, # probability of being infected when exposed
  probDiscoverInfection = 0.5, # dice rolled each time frame
  isolationCompliance = 0.8,
  
  # intervention config
  assumedTimeFromInfect = 3, # how far back in time to assume infection upon discovery
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
ggplot(curve.combined, aes(x=time, y=active, group=factor(group), color=factor(scenario, scenarios))) +
  geom_line() +
  ylim(0,1) +
  labs(x="Time",
       y="Proportion of population with active infection",
       color="App Adoption")

# ggplot(curve.default, aes(x=time, y=active, group=factor(trial))) +
#   geom_line(color='#cf1111') +
#   ylim(0,1) +
#   labs(title="Active Infections Over Time",x="Time", y = "Proportion of population with active infection")