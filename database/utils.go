package database

import "math"

func round2(val float64) float64 {
	return math.Round(val*100) / 100
}
