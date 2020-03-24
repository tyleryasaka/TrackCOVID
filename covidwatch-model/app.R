# ------------------------------------------------------- #
#### Libraries ####
# ------------------------------------------------------- #
library(shiny)
library(igraph)
library(rsconnect)
library(shinythemes)
library(ggplot2)
library(shinycssloaders)

source('./covidwatch-model.R')

ui = fluidPage(
  theme = shinytheme("slate"),
  mainPanel(
    fluidRow(
      align = "center",
      titlePanel("Infection Spread With and Without Peer to Peer Contact Tracing")
    ),
    fluidRow(
      align = "center",
      checkboxInput("toggleIntervention", "Use Peer to Peer Contact Tracing", value = initialConfig$toggleIntervention),
      selectInput("nTrials", "# of Simulations", 2:initialConfig$maxNTrials, selected = initialConfig$nTrials)
    ),
    fluidRow(
      column(
        3,
        sliderInput("activeTime", h3("Infectious Period"), min = 0, max = 20, value = initialConfig$activeTime),
        sliderInput("estimatedActiveTime", h3("Estimated Infectious Period"), min = 0, max = 20, value = initialConfig$estimatedActiveTime)
      ),
      column(
        3,
        sliderInput("diagnosisPeriod", h3("Diagnosis Delay"), min = 0, max = 20, value = initialConfig$diagnosisPeriod),
        sliderInput("estimatedDiagnosisPeriod", h3("Estimated Diagnosis Delay"), min = 0, max = 20, value = initialConfig$estimatedDiagnosisPeriod)
      ),
      column(
        3,
        sliderInput("infectionProb", h3("Transmission Rate"), min = 0, max = 1, value = initialConfig$infectionProb)
      ),
      column(
        3,
        
        sliderInput("interventionUsage", h3("Adoption Rate"), min = 0, max = 1, value = initialConfig$interventionUsage)
      )
    ),
    fluidRow(
      align = "center",
      column(
        6,
        verbatimTextOutput("percentInfectedMean")
        # actionButton("refresh", "Run Again with the Same Parameters", style="margin:10px 0")
      ),
      column(
        6,
        verbatimTextOutput("percentInfectedCurrent"),
        uiOutput('selectSim')
      )
    ),
    fluidRow(
      align = "center",
      column(
        6,
        plotOutput('plot2') %>% withSpinner(color="#dbb6b6")
      ),
      column(
        6,
        plotOutput('plot1') %>% withSpinner(color="#dbb6b6")
      )
    ),
    width = 12
  )
)

server = function(input, output) {
  values <- reactiveValues(currentSim = 1)
  observeEvent(input$currentSim, {
    values$currentSim <- as.numeric(input$currentSim)
  })
  modelOut = reactive(modelFn(input))
  simulationResults = reactive(modelOut()$simulationResults)
  infectionCurve = reactive(modelOut()$infectionCurve)
  currentResult = reactive(simulationResults()[[values$currentSim]])
  output$plot1 <- renderPlot({
    return(list(
      plot=plot(
        currentResult()$exposureNetwork,
        layout=function(g) { return(layout_on_grid(g, width=currentResult()$nPlaces)) },
        vertex.color=ifelse(
          currentResult()$exposeEvents,
          '#ed4e4e',
          '#86bdfc'
        ),
        xlab = "Location",
        ylab = "Time",
        vertex.size=rep(sqrt(currentResult()$placePopularities * 100), currentResult()$totalTime),
        vertex.label=NA,
        edge.width=0.5,
        edge.arrow.size=0.5,
        edge.color=ifelse(
          currentResult()$infectedMovements,
          '#e37d7d',
          '#86bdfc'
        ),
        label.font=2
      ),
      infected=currentResult()$infected,
      nTrials=currentResult()$nTrials
    ))
  })
  isCurrentTrial = reactive(factor(infectionCurve()$trial == values$currentSim, c(T, F), c(paste('#', values$currentSim, sep=''), 'Others')))
  output$plot2 = renderPlot({
    ggplot(infectionCurve(), aes(x=time, y=active, group=factor(trial), color=isCurrentTrial(), c(TRUE, FALSE))) +
      geom_line(size=1.5, aes(linetype=isCurrentTrial())) +
      scale_colour_manual(values=c('#ed4e4e', '#dbb6b6')) +
      scale_linetype_manual(values=c("solid", "dashed")) +
      ylim(0,1) +
      labs(
        title="Active Infections Over Time",
        x="Time",
        y = "Proportion of population with active infection",
        color = "Simulation",
        linetype = "Simulation")
  })
  output$percentInfectedMean <- renderText(
    {paste(
      'Average of ',
      currentResult()$nTrials,
      ' Simulations: ',
      paste(round(mean(sapply(simulationResults(), function(l) l$infected)) * 100), '%', sep=''),
      ' Infected',
      sep=''
    )}
  )
  output$percentInfectedCurrent <- renderText(
    {paste(
      'Selected Simulation: ',
      round(currentResult()$infected * 100),
      '% Infected',
      sep=''
    )}
  )
  output$selectSim = renderUI({
    selectInput("currentSim", "Show Simulation #", 1:currentResult()$nTrials, selected = values$currentSim)
  })
}

shinyApp(ui, server)